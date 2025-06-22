import { AppColors } from '@/constants/Colors';
import { StyleSheet, Text, View } from 'react-native';

export default function ExamScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exam</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
}); 