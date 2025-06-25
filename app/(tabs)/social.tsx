import React from 'react';
import { StyleSheet, View } from 'react-native';
import SocialFeed from '../../components/SocialFeed';

export default function SocialScreen() {
  return (
    <View style={styles.container}>
      <SocialFeed />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
}); 