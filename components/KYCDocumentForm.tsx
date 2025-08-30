import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface KYCDocumentFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const documentTypes = [
  { value: 'AADHAR_CARD', label: 'Aadhar Card' },
  { value: 'PAN_CARD', label: 'PAN Card' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'VOTER_ID', label: 'Voter ID' },
];

export default function KYCDocumentForm({ visible, onClose, onSuccess }: KYCDocumentFormProps) {
  const { user } = useAuth();
  const [documentType, setDocumentType] = useState('AADHAR_CARD');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDocumentTypeModal, setShowDocumentTypeModal] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload document image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setDocumentImage(base64Image);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setDocumentImage(base64Image);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!documentNumber.trim()) {
      Alert.alert('Error', 'Please enter document number.');
      return;
    }

    if (!documentImage) {
      Alert.alert('Error', 'Please upload document image.');
      return;
    }

    if (!user?.token) {
      Alert.alert('Error', 'Please log in to submit KYC documents.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        documentType,
        documentNumber: documentNumber.trim(),
        documentImage,
      };

      const response = await apiFetchAuth('/user/kyc/upload', user.token, {
        method: 'POST',
        body: payload,
      });

      if (response.ok) {
        Alert.alert(
          'Success',
          'KYC document uploaded successfully! Your documents will be verified shortly.',
          [
            {
              text: 'OK',
              onPress: () => {
                onClose();
                onSuccess?.();
                // Reset form
                setDocumentNumber('');
                setDocumentImage(null);
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to upload KYC document.');
      }
    } catch (error: any) {
      console.error('Error uploading KYC document:', error);
      if (error.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.');
      } else {
        Alert.alert('Error', error.data?.message || 'Failed to upload KYC document. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = (value: string) => {
    const type = documentTypes.find(t => t.value === value);
    return type ? type.label : value;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Upload KYC Document</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Document Type Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Document Type *</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowDocumentTypeModal(true)}
              >
                <Text style={styles.dropdownText}>
                  {getDocumentTypeLabel(documentType)}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Document Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Document Number *</Text>
              <TextInput
                style={styles.textInput}
                value={documentNumber}
                onChangeText={setDocumentNumber}
                placeholder="Enter document number"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
              />
            </View>

            {/* Document Image Upload */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Document Image *</Text>
              
              {documentImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: documentImage }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setDocumentImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadContainer}>
                  <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                    <Ionicons name="image" size={32} color="#4F46E5" />
                    <Text style={styles.uploadText}>Choose from Gallery</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.orText}>OR</Text>
                  
                  <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                    <Ionicons name="camera" size={32} color="#4F46E5" />
                    <Text style={styles.uploadText}>Take Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Upload Document</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Document Type Selection Modal */}
        <Modal
          visible={showDocumentTypeModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDocumentTypeModal(false)}
        >
          <View style={styles.typeModalOverlay}>
            <View style={styles.typeModalContent}>
              <View style={styles.typeModalHeader}>
                <Text style={styles.typeModalTitle}>Select Document Type</Text>
                <TouchableOpacity onPress={() => setShowDocumentTypeModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.typeModalBody}>
                {documentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeOption,
                      documentType === type.value && styles.selectedTypeOption,
                    ]}
                    onPress={() => {
                      setDocumentType(type.value);
                      setShowDocumentTypeModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        documentType === type.value && styles.selectedTypeOptionText,
                      ]}
                    >
                      {type.label}
                    </Text>
                    {documentType === type.value && (
                      <Ionicons name="checkmark" size={20} color="#4F46E5" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  modalBody: {
    padding: 24,
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  uploadContainer: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  uploadButton: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    width: '100%',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  orText: {
    fontSize: 14,
    color: '#6B7280',
    marginVertical: 8,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  typeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '80%',
    maxHeight: '60%',
    overflow: 'hidden',
  },
  typeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  typeModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  typeModalBody: {
    padding: 16,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedTypeOption: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  typeOptionText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  selectedTypeOptionText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
});
