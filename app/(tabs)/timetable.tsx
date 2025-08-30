import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, LayoutAnimation, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetchAuth } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const shortDayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
  })).sort((a, b) => new Date(a.startTime).getTime() - new Date(a.startTime).getTime());

  // Get upcoming plans (next 7 days)
  const upcomingPlans = timetables.flatMap(t => t.slots.filter((s: any) => {
    const slotDate = new Date(s.startTime);
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return slotDate >= today && slotDate <= nextWeek;
  })).sort((a, b) => new Date(a.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 3);

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
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading your schedule...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#F3E8FF', '#E9D5FF', '#D8B4FE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Background Graphics */}
          <View style={styles.headerBgGraphics}>
            <View style={styles.bgCircle1} />
            <View style={styles.bgCircle2} />
            <View style={styles.bgCircle3} />
            <View style={styles.bgDots} />
            <View style={styles.bgWave} />
          </View>
          
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.headerTitleRow}>
                <View style={styles.iconContainer}>
                  <Image 
                    source={require('../../assets/images/icons/p-cat3.png')} 
                    style={styles.headerIcon}
                    resizeMode="contain"
                  />
                  <View style={styles.iconGlow} />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>My Timetable</Text>
                  <Text style={styles.headerSubtitle}>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBackground}>
          <TouchableOpacity 
            style={[styles.tab, viewMode === 'calendar' && styles.tabActive]}
            onPress={() => setViewMode('calendar')}
          >
            <Text style={[styles.tabText, viewMode === 'calendar' && styles.tabTextActive]}>
              Calendar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, viewMode === 'timeline' && styles.tabActive]}
            onPress={() => setViewMode('timeline')}
          >
            <Text style={[styles.tabText, viewMode === 'timeline' && styles.tabTextActive]}>
              Timeline
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTimetable} />}>
        {viewMode === 'calendar' ? (
          <Animated.View style={[styles.calendarContent, { opacity: fadeAnim }]}>
            {/* Calendar Section */}
            <View style={styles.calendarSection}>
              <View style={styles.calendarGradient}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity 
                    style={styles.calendarNavButton}
                    onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  >
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                  </TouchableOpacity>
                  
                  <Text style={styles.calendarMonthText}>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.calendarNavButton}
                    onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  >
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Day Headers */}
                <View style={styles.calendarDayHeaders}>
                  {shortDayNames.map((day, index) => (
                    <View key={index} style={styles.calendarDayHeader}>
                      <Text style={styles.calendarDayHeaderText}>{day}</Text>
                    </View>
                  ))}
                </View>

                {/* Calendar Grid */}
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
            </View>

            {/* Today's Schedule Section */}
            <View style={styles.scheduleSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today's Schedule</Text>
                <View style={styles.sectionIconContainer}>
                  <Image 
                    source={require('../../assets/images/icons/p-cat3.png')} 
                    style={styles.sectionIcon}
                    resizeMode="contain"
                  />
                </View>
              </View>
              
              {selectedDateSlots.length === 0 ? (
                <View style={styles.emptySchedule}>
                  <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyScheduleText}>No plans for today</Text>
                  <Text style={styles.emptyScheduleSubtext}>Tap the + button to add a schedule</Text>
                </View>
              ) : (
                <View style={styles.scheduleCards}>
                  {selectedDateSlots.map((slot, index) => {
                    // Different faint background colors for each schedule card
                    const scheduleBackgroundColors = [
                      '#F0F4FF', // Light blue
                      '#FFF0F4', // Light pink
                      '#F0FFF4', // Light green
                      '#FFF4F0', // Light orange
                      '#F4F0FF', // Light purple
                      '#FFFFF0', // Light yellow
                      '#F0FFFF', // Light cyan
                      '#FFF0F0', // Light red
                    ];
                    
                    const scheduleBackgroundColor = scheduleBackgroundColors[index % scheduleBackgroundColors.length];
                    
                    // Dynamic data based on actual slot information
                    const getSubjectIcon = (subject: string) => {
                      const lowerSubject = subject.toLowerCase();
                      if (lowerSubject.includes('math') || lowerSubject.includes('mathematics')) {
                        return { icon: 'calculator', color: '#8B5CF6' };
                      } else if (lowerSubject.includes('chemistry') || lowerSubject.includes('chem')) {
                        return { icon: 'flask', color: '#3B82F6' };
                      } else if (lowerSubject.includes('computer') || lowerSubject.includes('cs') || lowerSubject.includes('programming')) {
                        return { icon: 'code-slash', color: '#F59E0B' };
                      } else if (lowerSubject.includes('physics')) {
                        return { icon: 'nuclear', color: '#EF4444' };
                      } else if (lowerSubject.includes('biology')) {
                        return { icon: 'leaf', color: '#10B981' };
                      } else if (lowerSubject.includes('english') || lowerSubject.includes('literature')) {
                        return { icon: 'book', color: '#8B5CF6' };
                      } else if (lowerSubject.includes('history')) {
                        return { icon: 'time', color: '#6B7280' };
                      } else if (lowerSubject.includes('art') || lowerSubject.includes('drawing')) {
                        return { icon: 'brush', color: '#EC4899' };
                      } else {
                        return { icon: 'book', color: '#8B5CF6' };
                      }
                    };

                    const getStatusInfo = (startTime: string) => {
                      const now = new Date();
                      const slotStart = new Date(startTime);
                      const slotEnd = new Date(startTime);
                      slotEnd.setHours(slotEnd.getHours() + 1.5); // Assuming 1.5 hour duration
                      
                      if (now >= slotStart && now <= slotEnd) {
                        return { status: 'In Progress', color: '#10B981' };
                      } else if (now < slotStart) {
                        return { status: 'Upcoming', color: '#6B7280' };
                      } else {
                        return { status: 'Completed', color: '#6B7280' };
                      }
                    };

                    const subjectIcon = getSubjectIcon(slot.subject || 'Study Session');
                    const statusInfo = getStatusInfo(slot.startTime);
                    
                    const data = {
                      subject: slot.subject || 'Study Session',
                      professor: slot.professor || 'Professor',
                      time: `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`,
                      status: statusInfo.status,
                      statusColor: statusInfo.color,
                      room: slot.room || 'Study Room',
                      icon: subjectIcon.icon,
                      iconColor: subjectIcon.color,
                      note: slot.notes
                    };
                    
                    return (
                      <View key={index} style={[styles.scheduleCard, { backgroundColor: scheduleBackgroundColor }]}>
                        <View style={styles.scheduleIcon}>
                          <View style={[styles.iconBackground, { backgroundColor: data.iconColor }]}>
                            <Ionicons name={data.icon as any} size={20} color="#fff" />
                          </View>
                        </View>
                        <View style={styles.scheduleContent}>
                          <Text style={styles.scheduleSubject}>{data.subject}</Text>
                          <Text style={styles.scheduleDetails}>
                            {data.professor} • {data.time}
                          </Text>
                          <View style={styles.scheduleStatus}>
                            <View style={[styles.statusDot, { backgroundColor: data.statusColor }]} />
                            <Text style={[styles.statusText, { color: data.statusColor }]}>
                              {data.status}
                            </Text>
                          </View>
                          {data.note && (
                            <View style={styles.scheduleNote}>
                              <Ionicons name="warning" size={12} color="#F59E0B" />
                              <Text style={styles.noteText}>{data.note}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.scheduleRoom}>
                          <Text style={styles.roomText}>{data.room}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Upcoming Tasks Section */}
            {upcomingPlans.length > 0 && (
              <View style={styles.tasksSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
                  <View style={styles.sectionIconContainer}>
                    <Image 
                      source={require('../../assets/images/icons/p-cat3.png')} 
                      style={styles.sectionIcon}
                      resizeMode="contain"
                    />
                  </View>
                </View>
                <View style={styles.taskCards}>
                  {upcomingPlans.map((plan, index) => {
                    // Dynamic data based on actual plan information
                    const getTaskIcon = (subject: string) => {
                      const lowerSubject = subject.toLowerCase();
                      if (lowerSubject.includes('math') || lowerSubject.includes('mathematics')) {
                        return { icon: 'calculator', color: '#EF4444' };
                      } else if (lowerSubject.includes('physics')) {
                        return { icon: 'nuclear', color: '#8B5CF6' };
                      } else if (lowerSubject.includes('chemistry')) {
                        return { icon: 'flask', color: '#3B82F6' };
                      } else if (lowerSubject.includes('computer') || lowerSubject.includes('cs')) {
                        return { icon: 'code-slash', color: '#F59E0B' };
                      } else if (lowerSubject.includes('biology')) {
                        return { icon: 'leaf', color: '#10B981' };
                      } else if (lowerSubject.includes('english') || lowerSubject.includes('literature')) {
                        return { icon: 'book', color: '#8B5CF6' };
                      } else {
                        return { icon: 'document-text', color: '#8B5CF6' };
                      }
                    };

                    const getDueDateInfo = (startTime: string) => {
                      const now = new Date();
                      const taskDate = new Date(startTime);
                      const diffTime = taskDate.getTime() - now.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays === 0) {
                        return { dueDate: 'Today', color: '#EF4444', priority: 'high' };
                      } else if (diffDays === 1) {
                        return { dueDate: 'Tomorrow', color: '#F59E0B', priority: 'medium' };
                      } else if (diffDays === 2) {
                        return { dueDate: 'Day After Tomorrow', color: '#8B5CF6', priority: 'medium' };
                      } else if (diffDays <= 3) {
                        return { dueDate: `In ${diffDays} days`, color: '#6B7280', priority: 'low' };
                      } else {
                        return { dueDate: taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: '#9CA3AF', priority: 'low' };
                      }
                    };

                    const taskIcon = getTaskIcon(plan.subject || 'Task');
                    const dueInfo = getDueDateInfo(plan.startTime);
                    
                    const data = {
                      title: plan.subject || 'Task',
                      details: plan.topic || 'Study Session',
                      dueDate: dueInfo.dueDate,
                      dueColor: dueInfo.color,
                      priority: dueInfo.priority,
                      icon: taskIcon.icon,
                      iconColor: taskIcon.color,
                      time: formatTime(plan.startTime)
                    };
                    
                    return (
                      <View key={index} style={styles.taskCard}>
                        <View style={styles.taskIcon}>
                          <View style={[styles.iconBackground, { backgroundColor: data.iconColor }]}>
                            <Ionicons name={data.icon as any} size={18} color="#fff" />
                          </View>
                        </View>
                        <View style={styles.taskContent}>
                          <Text style={styles.taskTitle}>{data.title}</Text>
                          <Text style={styles.taskDetails}>{data.details}</Text>
                          <Text style={styles.taskTime}>{data.time}</Text>
                        </View>
                        <View style={styles.taskDue}>
                          <View style={[styles.priorityBadge, { backgroundColor: data.dueColor + '20' }]}>
                            <Text style={[styles.dueText, { color: data.dueColor }]}>
                              {data.dueDate}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </Animated.View>
        ) : (
          <Animated.View style={[styles.timelineContent, { opacity: fadeAnim }]}>
            {/* Timeline */}
            <View style={styles.timelineContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today's Timeline</Text>
              </View>
              
              {selectedDateSlots.length === 0 ? (
                <View style={styles.emptyTimeline}>
                  <Ionicons name="time-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyTimelineText}>No plans scheduled</Text>
                    <Text style={styles.emptyTimelineSubtext}>Add a schedule to get started</Text>
                </View>
              ) : (
                <View style={styles.timelineItems}>
                  {selectedDateSlots.map((slot, index) => {
                    // Different enhanced background colors for each session
                    const backgroundColors = [
                      '#E0E7FF', // Enhanced light blue
                      '#FCE7F3', // Enhanced light pink
                      '#D1FAE5', // Enhanced light green
                      '#FED7AA', // Enhanced light orange
                      '#E9D5FF', // Enhanced light purple
                      '#FEF3C7', // Enhanced light yellow
                      '#CFFAFE', // Enhanced light cyan
                      '#FEE2E2', // Enhanced light red
                    ];
                    
                    const backgroundColor = backgroundColors[index % backgroundColors.length];
                    
                    return (
                      <View key={index} style={[styles.timelineItem, { backgroundColor }]}>
                        <View style={styles.timelineContentContainer}>
                          <View style={styles.timelineCard}>
                            <View style={styles.timelineTitleRow}>
                              <Text style={styles.timelineTitle}>{slot.subject}</Text>
                              <View style={styles.timelineTimeIcon}>
                                <Image 
                                  source={require('../../assets/images/icons/p-cat3.png')} 
                                  style={styles.timelineTimeImage}
                                  resizeMode="contain"
                                />
                              </View>
                            </View>
                            {slot.topic && (
                              <Text style={styles.timelineSubtitle}>{slot.topic}</Text>
                            )}
                            <View style={styles.timelineLocation}>
                              <Text style={styles.timelineLocationText}>Study Session</Text>
                              <Text style={styles.timelineTimeInline}>{formatTime(slot.startTime)}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED']}
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
                  <Ionicons name="repeat" size={20} color="#8B5CF6" />
                  <Text style={styles.switchLabel}>Repeat Weekly</Text>
                </View>
                <Switch 
                  value={isWeekly} 
                  onValueChange={setIsWeekly} 
                  thumbColor={isWeekly ? '#8B5CF6' : '#f4f3f4'} 
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
                        <Ionicons name="time" size={20} color="#8B5CF6" />
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
                        <Ionicons name="time" size={20} color="#8B5CF6" />
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
                      <Ionicons name="notifications" size={20} color="#8B5CF6" />
                      <Text style={styles.switchLabel}>Set Reminder</Text>
                    </View>
                    <Switch 
                      value={slot.reminder} 
                      onValueChange={v => handleSlotChange(idx, 'reminder', v)} 
                      thumbColor={slot.reminder ? '#8B5CF6' : '#f4f3f4'} 
                      trackColor={{ true: '#e0d5ff', false: '#f4f3f4' }} 
                    />
                  </View>
                </View>
              ))}
              
              <TouchableOpacity style={styles.addSlotBtn} onPress={handleAddSlot}>
                <Ionicons name="add-circle" size={24} color="#8B5CF6" />
                <Text style={styles.addSlotText}>Add Another Session</Text>
              </TouchableOpacity>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.createBtn} 
                  onPress={handleCreateTimetable} 
                  disabled={creating}
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
  },
  loadingText: {
    color: '#8B5CF6',
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
  header: {
    backgroundColor: 'transparent',
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 15,
    marginTop: -15,
    marginBottom: 0,
  },
  headerGradient: {
    borderRadius: 20,
    padding: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 45,
    height: 45,
    marginRight: 18,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: 25,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    opacity: 0.8,
    zIndex: -1,
  },
  headerBgGraphics: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  bgCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -20,
    left: -20,
  },
  bgCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: 100,
    right: -50,
  },
  bgCircle3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: 200,
    left: 100,
  },
  bgDots: {
    position: 'absolute',
    top: 100,
    left: 100,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 50,
  },
  bgWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textShadowColor: 'rgba(139, 92, 246, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  tabContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    marginTop: 10,
    marginBottom: 10,
  },
  tabBackground: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 25,
    padding: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  tab: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
  },
  calendarContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 140,
  },
  calendarSection: {
    marginBottom: 20,
  },
  calendarGradient: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#C7D2FE',
    backgroundColor: '#FCE7F3',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  calendarNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarMonthText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4C1D95',
    textAlign: 'center',
    flex: 1,
    textShadowColor: 'rgba(139, 92, 246, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  calendarDayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  calendarDayHeader: {
    alignItems: 'center',
  },
  calendarDayHeaderText: {
    fontSize: 14,
    color: '#5B21B6',
    fontWeight: 'bold',
    textShadowColor: 'rgba(139, 92, 246, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarDayText: {
    fontSize: 16,
    color: '#4C1D95',
    fontWeight: '600',
    textShadowColor: 'rgba(139, 92, 246, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  calendarDayToday: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  calendarDaySelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.35)',
    borderColor: 'rgba(139, 92, 246, 0.5)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  calendarDayTextToday: {
    color: '#4C1D95',
    fontWeight: 'bold',
    fontSize: 17,
  },
  calendarDayTextSelected: {
    color: '#4C1D95',
    fontWeight: 'bold',
    fontSize: 17,
  },
  calendarDayTextOtherMonth: {
    color: '#A78BFA',
    opacity: 0.7,
  },
  calendarDayOtherMonth: {
    opacity: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  eventDot: {
    width: 8,
    height: 8,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
    marginTop: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  scheduleSection: {
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#C7D2FE',
    borderRadius: 20,
    padding: 12,
    backgroundColor: 'transparent',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  tasksSection: {
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#C7D2FE',
    borderRadius: 16,
    padding: 15,
    backgroundColor: '#F3E8FF',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#4C1D95',
    fontSize: 20,
    textShadowColor: 'rgba(139, 92, 246, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  seeAllText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  emptySchedule: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 25,
  },
  emptyScheduleText: {
    fontSize: 16,
    color: '#4C1D95',
    marginTop: 6,
    fontWeight: 'bold',
  },
  emptyScheduleSubtext: {
    fontSize: 13,
    color: '#7C3AED',
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.8,
  },
  scheduleCards: {
    backgroundColor: 'transparent',
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF7FF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  scheduleIcon: {
    marginRight: 10,
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleSubject: {
    fontWeight: 'bold',
    color: '#4C1D95',
    fontSize: 15,
    marginBottom: 3,
  },
  scheduleDetails: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 6,
  },
  scheduleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scheduleNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  noteText: {
    color: '#F59E0B',
    fontSize: 11,
    marginLeft: 5,
    fontWeight: '500',
  },
  scheduleRoom: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  roomText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
  },
  taskCards: {
    backgroundColor: 'transparent',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF7FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  taskIcon: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontWeight: 'bold',
    color: '#1F2937',
    fontSize: 16,
    marginBottom: 4,
  },
  taskDetails: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 0,
  },
  taskTime: {
    color: '#8B5CF6',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  taskDue: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dueText: {
    fontSize: 12,
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  timelineContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 140,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  timelineHeaderCenter: {
    alignItems: 'center',
  },
  timelineDate: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  timelineGreeting: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  timelineContainer: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 12,
    marginTop: 0,
    marginHorizontal: 5,
  },
  timelineItems: {
    backgroundColor: 'transparent',
  },
  timelineItem: {
    marginBottom: 8,
    borderRadius: 16,
    padding: 10,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  timelineMarker: {
    width: 60,
    alignItems: 'center',
    position: 'absolute',
    left: -30,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8B5CF6',
    marginBottom: 8,
  },
  timelineLine: {
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    position: 'absolute',
    left: 29,
  },
  timelineContentContainer: {
    flex: 1,
  },
  timelineTime: {
    width: 60,
    alignItems: 'center',
    position: 'absolute',
    left: -30,
  },
  timelineTimeText: {
    fontSize: 13,
    color: '#8B5CF6',
    marginTop: 8,
    fontWeight: 'bold',
  },
  timelineCard: {
    backgroundColor: 'transparent',
  },
  timelineTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  timelineTitle: {
    fontWeight: 'bold',
    color: '#1F2937',
    fontSize: 15,
  },
  timelineTimeIcon: {
    padding: 5,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 10,
  },
  timelineTimeImage: {
    width: 20,
    height: 20,
  },
  timelineSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 6,
  },
  timelineLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  timelineLocationText: {
    color: '#8B5CF6',
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '500',
    flex: 1,
  },
  timelineTimeInline: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 6,
  },
  timelineActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timelineActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flex: 1,
    marginHorizontal: 2,
    justifyContent: 'center',
  },
  timelineActionText: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  emptyTimeline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTimelineText: {
    fontSize: 20,
    color: '#1F2937',
    marginTop: 10,
    fontWeight: 'bold',
  },
  emptyTimelineSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 25,
    bottom: Platform.OS === 'ios' ? 80 : 90,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  fabGradient: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: 'rgba(139, 92, 246, 0.2)',
    shadowColor: '#8B5CF6',
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
    color: '#8B5CF6',
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
    shadowColor: '#8B5CF6',
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
    borderColor: 'rgba(139, 92, 246, 0.2)',
    shadowColor: '#8B5CF6',
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
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  dayPillActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  dayPillText: {
    fontSize: 13,
    color: '#8B5CF6',
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
    color: '#8B5CF6',
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
    borderColor: 'rgba(139, 92, 246, 0.1)',
    shadowColor: '#8B5CF6',
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
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
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
    color: '#8B5CF6',
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
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionIcon: {
    width: 24,
    height: 24,
  },
});
