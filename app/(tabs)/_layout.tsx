import CustomTabBar from '@/components/CustomTabBar';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide default tab bar
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="exam"
        options={{
          title: 'Exam',
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: 'Quiz',
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
      <Tabs.Screen
        name="timetable"
        options={{
          title: 'Timetable',
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
        }}
      />
      <Tabs.Screen
        name="my-exams"
        options={{
          title: 'My Exams',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="user-profile"
        options={{
          title: 'User Profile',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
} 