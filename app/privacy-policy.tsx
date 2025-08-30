import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const PrivacyPolicyScreen = () => {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            {/* Enhanced Header with Modern Design */}
            <LinearGradient
                colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerText}>
                        <View style={styles.titleContainer}>
                            <Ionicons name="shield-checkmark" size={28} color="#FFFFFF" style={styles.headerIcon} />
                            <Text style={styles.headerTitle}>Privacy Policy</Text>
                        </View>
                        <Text style={styles.headerSubtitle}>Last updated: January 2025</Text>
                    </View>
                    <View style={styles.placeholder} />
                </View>
                
                {/* Header Background Pattern */}
                <View style={styles.headerPattern}>
                    <View style={styles.patternCircle1} />
                    <View style={styles.patternCircle2} />
                    <View style={styles.patternCircle3} />
                </View>
            </LinearGradient>

            {/* Enhanced Content */}
            <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.contentContainer}>
                    {/* Enhanced Section 1 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="information-circle" size={24} color="#4F46E5" />
                            </View>
                            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            We collect information you provide directly to us, such as when you create an account, 
                            take exams, or contact our support team. This may include your name, email address, 
                            phone number, and educational information.
                        </Text>
                    </View>

                    {/* Enhanced Section 2 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="settings" size={24} color="#7C3AED" />
                            </View>
                            <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            We use the information we collect to provide, maintain, and improve our services, 
                            process your exam results, communicate with you about your account, and send you 
                            important updates about our platform.
                        </Text>
                    </View>

                    {/* Enhanced Section 3 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="share-social" size={24} color="#8B5CF6" />
                            </View>
                            <Text style={styles.sectionTitle}>3. Information Sharing</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            We do not sell, trade, or otherwise transfer your personal information to third parties 
                            without your consent, except as described in this policy or as required by law.
                        </Text>
                    </View>

                    {/* Enhanced Section 4 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="lock-closed" size={24} color="#EF4444" />
                            </View>
                            <Text style={styles.sectionTitle}>4. Data Security</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            We implement appropriate security measures to protect your personal information against 
                            unauthorized access, alteration, disclosure, or destruction. However, no method of 
                            transmission over the internet is 100% secure.
                        </Text>
                    </View>

                    {/* Enhanced Section 5 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="analytics" size={24} color="#10B981" />
                            </View>
                            <Text style={styles.sectionTitle}>5. Cookies and Tracking</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            We use cookies and similar tracking technologies to enhance your experience on our 
                            platform, analyze usage patterns, and personalize content and advertisements.
                        </Text>
                    </View>

                    {/* Enhanced Section 6 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="link" size={24} color="#F59E0B" />
                            </View>
                            <Text style={styles.sectionTitle}>6. Third-Party Services</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            Our platform may contain links to third-party websites or services. We are not 
                            responsible for the privacy practices of these third parties. We encourage you to 
                            review their privacy policies.
                        </Text>
                    </View>

                    {/* Enhanced Section 7 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="happy" size={24} color="#EC4899" />
                            </View>
                            <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            Our services are not intended for children under 13 years of age. We do not 
                            knowingly collect personal information from children under 13. If you are a parent 
                            or guardian and believe your child has provided us with personal information, 
                            please contact us.
                        </Text>
                    </View>

                    {/* Enhanced Section 8 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="refresh" size={24} color="#06B6D4" />
                            </View>
                            <Text style={styles.sectionTitle}>8. Changes to This Policy</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            We may update this privacy policy from time to time. We will notify you of any 
                            changes by posting the new policy on this page and updating the "Last updated" date.
                        </Text>
                    </View>

                    {/* Enhanced Section 9 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
                            </View>
                            <Text style={styles.sectionTitle}>9. Your Rights</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            You have the right to access, correct, or delete your personal information. 
                            You may also have the right to restrict or object to certain processing of your data. 
                            Contact us to exercise these rights.
                        </Text>
                    </View>

                    {/* Enhanced Section 10 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="mail" size={24} color="#EF4444" />
                            </View>
                            <Text style={styles.sectionTitle}>10. Contact Us</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            If you have any questions about this privacy policy or our data practices, 
                            please contact us at:
                        </Text>
                        <View style={styles.contactCard}>
                            <View style={styles.contactItem}>
                                <Ionicons name="mail-outline" size={20} color="#4F46E5" />
                                <Text style={styles.contactInfo}>privacy@examapp.com</Text>
                            </View>
                            <View style={styles.contactItem}>
                                <Ionicons name="call-outline" size={20} color="#7C3AED" />
                                <Text style={styles.contactInfo}>+1 (555) 123-4567</Text>
                            </View>
                            <View style={styles.contactItem}>
                                <Ionicons name="location-outline" size={20} color="#8B5CF6" />
                                <Text style={styles.contactInfo}>123 Exam Street, Education City, EC 12345</Text>
                            </View>
                        </View>
                    </View>

                    {/* Enhanced Footer */}
                    <View style={styles.footer}>
                        <LinearGradient
                            colors={['rgba(79, 70, 229, 0.1)', 'rgba(124, 58, 237, 0.05)']}
                            style={styles.footerGradient}
                        >
                            <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
                            <Text style={styles.footerText}>
                                This privacy policy is effective as of January 1, 2025.
                            </Text>
                        </LinearGradient>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 15,
        position: 'relative',
        overflow: 'hidden',
    },
    headerPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.15,
    },
    patternCircle1: {
        position: 'absolute',
        top: 20,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    patternCircle2: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    patternCircle3: {
        position: 'absolute',
        top: 60,
        left: 50,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    headerText: {
        flex: 1,
        alignItems: 'center',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerIcon: {
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        fontWeight: '500',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    placeholder: {
        width: 48,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        marginBottom: 20,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.1)',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
        lineHeight: 28,
        letterSpacing: 0.3,
    },
    paragraph: {
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 24,
        marginBottom: 0,
        textAlign: 'left',
        fontWeight: '400',
        letterSpacing: 0.2,
    },
    contactCard: {
        backgroundColor: 'rgba(79, 70, 229, 0.05)',
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.1)',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    contactInfo: {
        fontSize: 16,
        color: '#4F46E5',
        lineHeight: 24,
        marginLeft: 12,
        fontWeight: '600',
        flex: 1,
    },
    footer: {
        marginTop: 20,
        marginBottom: 20,
    },
    footerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.2)',
    },
    footerText: {
        fontSize: 16,
        color: '#4F46E5',
        textAlign: 'center',
        fontWeight: '600',
        marginLeft: 12,
        letterSpacing: 0.3,
    },
});

export default PrivacyPolicyScreen; 