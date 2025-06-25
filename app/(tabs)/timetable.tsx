import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, LayoutAnimation, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import { apiFetchAuth } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

// Define a palette of richer, darker pastel colors for slot cards
const slotColors = ['#ffe066', '#ffd6a5', '#bdb2ff', '#a0c4ff'];

export default function TimetableScreen() {
  const { user } = useAuth();
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<{ [id: string]: boolean }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');

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

  // Add state for which slot/date is being picked
  const [datePicker, setDatePicker] = useState<{ idx: number; field: 'startTime' | 'endTime' } | null>(null);
  const [datePickerValue, setDatePickerValue] = useState(new Date());

  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    return new Date(now.setDate(diff));
  });

  // Group slots by day
  const weekDays = getWeekDays(weekStart);
  const slotsByDay = weekDays.map(day => ({
    date: day,
    slots: timetables.flatMap(t => t.slots.filter((s: any) => {
      const slotDate = new Date(s.startTime);
      return slotDate.toDateString() === day.toDateString();
    }))
  }));

  useEffect(() => {
    fetchTimetable();
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

  // Add Timetable Handlers
  const handleAddSlot = () => {
    setSlots([...slots, {
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
    if (slots.length === 1) return;
    setSlots(slots.filter((_, i) => i !== idx));
  };
  const handleSlotChange = (idx: number, key: string, value: any) => {
    setSlots(slots.map((slot, i) => i === idx ? { ...slot, [key]: value } : slot));
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
    if (!name || !description || slots.some(s => !s.startTime || !s.endTime || !s.subject)) {
      Alert.alert('Error', 'Please fill all required fields for exam and slots.');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        name,
        description,
        isWeekly,
        slots: slots.map(s => ({
          ...s,
          startTime: s.startTime,
          endTime: s.endTime,
          reminder: s.reminder.toString(),
        })),
      };
      const res = await apiFetchAuth('/student/timetable', user?.token || '', {
        method: 'POST',
        body: payload,
      });
      if (res.ok) {
        setModalVisible(false);
        resetForm();
        fetchTimetable();
      } else {
        Alert.alert('Error', 'Failed to create timetable.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to create timetable.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#6C63FF" />;
  }
  if (error) {
    return <Text style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</Text>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F8FB' }}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Study Timetable</Text>
        <Text style={styles.headerSubtitle}>Organize your study schedule efficiently</Text>
        <View style={styles.headerActions}>
          <View style={{ flexDirection: 'row', backgroundColor: '#ede7f6', borderRadius: 20, padding: 4, marginRight: 8 }}>
            <TouchableOpacity onPress={() => setViewMode('daily')} style={{ backgroundColor: viewMode === 'daily' ? '#fff' : 'transparent', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 6 }}>
              <Text style={{ color: viewMode === 'daily' ? '#764ba2' : '#888', fontWeight: 'bold' }}>Daily</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setViewMode('weekly')} style={{ backgroundColor: viewMode === 'weekly' ? '#fff' : 'transparent', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 6 }}>
              <Text style={{ color: viewMode === 'weekly' ? '#764ba2' : '#888', fontWeight: 'bold' }}>Weekly</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}><Ionicons name="add" size={20} color="#fff" /> <Text style={{color:'#fff',fontWeight:'bold'}}>Add Schedule</Text></TouchableOpacity>
        </View>
      </LinearGradient>
      {/* Week Navigation */}
      {viewMode === 'weekly' ? (
        <View style={{ paddingHorizontal: 18, marginTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <TouchableOpacity onPress={() => setWeekStart(new Date(weekStart.setDate(weekStart.getDate() - 7)))} style={{ backgroundColor: '#ede7f6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 10, elevation: 2 }}>
              <Text style={{ color: '#667eea', fontWeight: 'bold' }}>{'<'}</Text>
            </TouchableOpacity>
            <View style={{ backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 22, paddingVertical: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 }}>
              <Text style={{ color: '#764ba2', fontWeight: 'bold', fontSize: 16 }}>Week of {weekDays[0].toLocaleString('default', { month: 'long' })} {weekDays[0].getDate()}</Text>
            </View>
            <TouchableOpacity onPress={() => setWeekStart(new Date(weekStart.setDate(weekStart.getDate() + 7)))} style={{ backgroundColor: '#ede7f6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginLeft: 10, elevation: 2 }}>
              <Text style={{ color: '#667eea', fontWeight: 'bold' }}>{'>'}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 1, backgroundColor: '#ececec', marginBottom: 10, borderRadius: 1 }} />
        </View>
      ) : (
        <View style={{ paddingHorizontal: 18, marginTop: 18 }}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontWeight: 'bold', color: '#764ba2', fontSize: 18 }}>{dayNames[new Date().getDay()]}, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }}>
            {(() => {
              const today = new Date();
              const todaySlots = timetables.flatMap(t => t.slots.filter((s: any) => {
                const slotDate = new Date(s.startTime);
                return (
                  slotDate.getFullYear() === today.getFullYear() &&
                  slotDate.getMonth() === today.getMonth() &&
                  slotDate.getDate() === today.getDate()
                );
              }));
              if (todaySlots.length === 0) {
                return (
                  <View style={{ alignItems: 'center', marginTop: 40 }}>
                    <Ionicons name="calendar-outline" size={36} color="#bbb" style={{ marginBottom: 8 }} />
                    <Text style={{ color: '#bbb', fontSize: 16 }}>No slots scheduled for today</Text>
                  </View>
                );
              }
              return todaySlots.map((slot, i) => (
                <View key={i} style={[styles.slotCardModern, { backgroundColor: slotColors[i % slotColors.length], marginBottom: 18, shadowColor: '#764ba2', shadowOpacity: 0.10, shadowRadius: 8, elevation: 2 }]}> 
                  <Text style={styles.slotSubject}>{slot.subject}</Text>
                  <Text style={styles.slotTime}>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</Text>
                  {slot.topic && <Text style={styles.slotTopic}>({slot.topic})</Text>}
                  {slot.notes && <Text style={styles.slotNotes}>{slot.notes}</Text>}
                </View>
              ));
            })()}
          </ScrollView>
        </View>
      )}
      {/* Week Days */}
      {viewMode === 'weekly' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysRow}>
          {slotsByDay.map(({ date, slots }, idx) => {
            const isToday = new Date().toDateString() === date.toDateString();
            return (
              <View key={idx} style={[styles.dayCard, isToday && styles.dayCardActive, { marginBottom: 10, shadowColor: '#764ba2', shadowOpacity: 0.10, shadowRadius: 8, elevation: 3 }]}>
                <Text style={[styles.dayName, isToday && styles.dayNameActive]}>
                  {date.toLocaleString('default', { weekday: 'short' })}
                </Text>
                <Text style={styles.dayDate}>{date.toLocaleString('default', { month: 'short' })} {date.getDate()}</Text>
                {slots.length === 0 ? (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 18, marginBottom: 18 }}>
                    <Ionicons name="calendar-outline" size={28} color="#bbb" style={{ marginBottom: 4 }} />
                    <Text style={styles.noSlots}>No slots</Text>
                  </View>
                ) : (
                  slots.map((slot, i) => (
                    <View key={i} style={[styles.slotCardModern, { backgroundColor: slotColors[i % slotColors.length] }]}>
                      <Text style={styles.slotSubject}>{slot.subject}</Text>
                      <Text style={styles.slotTime}>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</Text>
                      {slot.topic && <Text style={styles.slotTopic}>({slot.topic})</Text>}
                      {slot.notes && <Text style={styles.slotNotes}>{slot.notes}</Text>}
                    </View>
                  ))
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="#fff" />
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
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Add Timetable</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Exam Name"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Description"
                value={description}
                onChangeText={setDescription}
              />
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Weekly?</Text>
                <Switch value={isWeekly} onValueChange={setIsWeekly} thumbColor={isWeekly ? '#6C63FF' : '#eee'} trackColor={{ true: '#D1C4E9', false: '#eee' }} />
              </View>
              <Text style={styles.modalSectionTitle}>Slots</Text>
              {slots.map((slot, idx) => (
                <View key={idx} style={styles.slotFormCard}>
                  <Text style={styles.inputLabel}>Day</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPillRow}>
                    {dayNames.map((d, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.dayPill, slot.day === i && styles.dayPillActive]}
                        onPress={() => handleSlotChange(idx, 'day', i)}
                      >
                        <Text style={[styles.dayPillText, slot.day === i && styles.dayPillTextActive]}>{d.slice(0, 3)}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={styles.inputLabel}>Start Time</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="HH:MM (e.g., 14:30)"
                    placeholderTextColor="#888"
                    value={slot.startTime}
                    onChangeText={v => handleSlotChange(idx, 'startTime', v)}
                  />
                  <Text style={styles.inputLabel}>End Time</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="HH:MM (e.g., 15:45)"
                    placeholderTextColor="#888"
                    value={slot.endTime}
                    onChangeText={v => handleSlotChange(idx, 'endTime', v)}
                  />
                  <Text style={styles.inputLabel}>Subject</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Subject"
                    placeholderTextColor="#888"
                    value={slot.subject}
                    onChangeText={v => handleSlotChange(idx, 'subject', v)}
                  />
                  <Text style={styles.inputLabel}>Topic</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Topic"
                    placeholderTextColor="#888"
                    value={slot.topic}
                    onChangeText={v => handleSlotChange(idx, 'topic', v)}
                  />
                  <Text style={styles.inputLabel}>Notes</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Notes"
                    placeholderTextColor="#888"
                    value={slot.notes}
                    onChangeText={v => handleSlotChange(idx, 'notes', v)}
                  />
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Reminder</Text>
                    <Switch value={slot.reminder} onValueChange={v => handleSlotChange(idx, 'reminder', v)} thumbColor={slot.reminder ? '#6C63FF' : '#eee'} trackColor={{ true: '#D1C4E9', false: '#eee' }} />
                    <TouchableOpacity onPress={() => handleRemoveSlot(idx)} style={styles.removeSlotBtn}>
                      <Ionicons name="trash" size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.addSlotBtn} onPress={handleAddSlot}>
                <Ionicons name="add-circle" size={22} color="#6C63FF" />
                <Text style={styles.addSlotText}>Add Slot</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreateTimetable} disabled={creating}>
                <Text style={styles.createBtnText}>{creating ? 'Creating...' : 'Create Timetable'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
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
    padding: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 12,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 28,
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#ede7f6',
    fontSize: 15,
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  addBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  navBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ede7f6',
  },
  weekLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#6C63FF',
  },
  daysRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginRight: 12,
    width: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  dayCardActive: {
    backgroundColor: '#6C63FF',
  },
  dayName: {
    fontWeight: 'bold',
    color: '#6C63FF',
    fontSize: 16,
  },
  dayNameActive: {
    color: '#fff',
  },
  dayDate: {
    color: '#888',
    fontSize: 13,
    marginBottom: 8,
  },
  noSlots: {
    color: '#bbb',
    fontSize: 13,
    marginTop: 12,
  },
  slotCardModern: {
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    width: '100%',
  },
  slotSubject: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
  },
  slotTime: {
    color: '#666',
    fontSize: 13,
  },
  slotTopic: {
    color: '#4f8cff',
    fontWeight: 'normal',
    fontSize: 13,
  },
  slotNotes: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
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
    color: '#6C63FF',
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
});
