import { AppColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import QuestionOfTheDay from './QuestionOfTheDay';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const QuestionOfTheDayPreview = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      {/* Preview Section */}
      <View style={styles.previewContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.previewGradient}
        >
          <View style={styles.previewContent}>
            <View style={styles.previewLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="bulb-outline" size={24} color={AppColors.white} />
              </View>
              <View style={styles.previewTextContainer}>
                <Text style={styles.previewTitle}>Question of the Day</Text>
                <Text style={styles.previewSubtitle}>Test your knowledge daily!</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.viewButton} onPress={openModal}>
              <Text style={styles.viewButtonText}>View</Text>
              <Ionicons name="arrow-forward" size={16} color={AppColors.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Modal */}
      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.centeredOverlay}>
          <View style={styles.centeredCard}>
            <LinearGradient
              colors={['#667eea', '#764ba2', '#f093fb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Header with Close Button */}
              <View style={styles.modalHeader}>
                <View style={styles.headerContent}>
                  <View style={styles.headerIcon}>
                    <Ionicons name="bulb" size={28} color="#fff" />
                  </View>
                  <View style={styles.headerText}>
                    <Text style={styles.modalTitle}>Question of the Day</Text>
                    <Text style={styles.modalSubtitle}>Test your knowledge!</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Content Container */}
              <View style={styles.contentContainer}>
                <QuestionOfTheDay />
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    margin: 15,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  previewGradient: {
    borderRadius: 16,
    padding: 20,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 8,
  },
  previewTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.white,
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  viewButtonText: {
    color: AppColors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.white,
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 0,
    minHeight: 450,
    maxHeight: 650,
  },
  centeredOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centeredCard: {
    width: '90%',
    minHeight: 550,
    maxHeight: 750,
    paddingVertical: 12,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 550,
    maxHeight: 750,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 8,
  },
  headerText: {
    marginLeft: 15,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  contentContainer: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
});

export default QuestionOfTheDayPreview; 