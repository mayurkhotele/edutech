import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const Welcome = () => {
    const router = useRouter();

  return (
    <View style={styles.container}>
        {/* Background with Abstract Shapes */}
        <View style={styles.backgroundContainer}>
            {/* Purple Blob Shapes */}
            <View style={[styles.purpleBlob, styles.blob1]} />
            <View style={[styles.purpleBlob, styles.blob2]} />
            <View style={[styles.purpleBlob, styles.blob3]} />
            
            {/* Yellow Accent Circles */}
            <View style={[styles.yellowCircle, styles.circle1]} />
            <View style={[styles.yellowCircle, styles.circle2]} />
            <View style={[styles.yellowCircle, styles.circle3]} />
            <View style={[styles.yellowCircle, styles.circle4]} />
            <View style={[styles.yellowCircle, styles.circle5]} />
            
            {/* Line Art Icons */}
            <View style={[styles.lineIcon, styles.lightbulb]}>
                <Ionicons name="bulb-outline" size={24} color="#e0e0e0" />
                <View style={styles.yellowDots}>
                    <View style={styles.yellowDot} />
                    <View style={styles.yellowDot} />
                    <View style={styles.yellowDot} />
                </View>
            </View>
            
            <View style={[styles.lineIcon, styles.globe1]}>
                <Ionicons name="globe-outline" size={20} color="#e0e0e0" />
            </View>
            
            <View style={[styles.lineIcon, styles.playButton]}>
                <Ionicons name="play" size={16} color="#e0e0e0" />
            </View>
            
            <View style={[styles.lineIcon, styles.eyeglasses]}>
                <Ionicons name="glasses-outline" size={18} color="#e0e0e0" />
            </View>
            
            <View style={[styles.lineIcon, styles.smiley]}>
                <Ionicons name="happy-outline" size={16} color="#e0e0e0" />
            </View>
            
            <View style={[styles.lineIcon, styles.star]}>
                <Ionicons name="star-outline" size={14} color="#e0e0e0" />
            </View>
            
            <View style={[styles.lineIcon, styles.question1]}>
                <Ionicons name="help-circle-outline" size={16} color="#e0e0e0" />
            </View>
            
            <View style={[styles.lineIcon, styles.question2]}>
                <Ionicons name="help-circle-outline" size={12} color="#e0e0e0" />
            </View>
            
            <View style={[styles.lineIcon, styles.exclamation]}>
                <Ionicons name="alert-circle-outline" size={14} color="#e0e0e0" />
            </View>
            
            <View style={[styles.lineIcon, styles.music]}>
                <Ionicons name="musical-notes-outline" size={16} color="#e0e0e0" />
            </View>
            
            <View style={[styles.lineIcon, styles.plus]}>
                <Ionicons name="add" size={12} color="#e0e0e0" />
            </View>
            
            {/* Small Abstract Elements */}
            <View style={[styles.smallDot, styles.dot1]} />
            <View style={[styles.smallDot, styles.dot2]} />
            <View style={[styles.smallDot, styles.dot3]} />
            <View style={[styles.smallDot, styles.dot4]} />
            <View style={[styles.smallDot, styles.dot5]} />
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
            {/* Central Yottascore Text */}
            <View style={styles.titleContainer}>
                <Text style={styles.titleText}>YOTTA</Text>
                <Text style={styles.titleText}>SCORE</Text>
            </View>
            
            {/* Subtitle */}
            <Text style={styles.subtitleText}>Smart Learning Platform</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={() => router.push('/login')} activeOpacity={0.85}>
                <LinearGradient
                    colors={["#667eea", "#764ba2"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Login</Text>
                </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.separator} />
            
            <TouchableOpacity onPress={() => router.push('/register')} activeOpacity={0.85}>
                <LinearGradient
                    colors={["#764ba2", "#667eea"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Register</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', // White background like DT QUIZ
    },
    backgroundContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
    },
    purpleBlob: {
        position: 'absolute',
        borderRadius: 100,
        opacity: 0.1,
    },
    blob1: {
        width: width * 0.6,
        height: width * 0.6,
        backgroundColor: '#6C63FF', // Your app's purple
        top: -height * 0.1,
        left: -width * 0.2,
    },
    blob2: {
        width: width * 0.4,
        height: width * 0.4,
        backgroundColor: '#FF6CAB', // Your app's pink
        bottom: height * 0.3,
        right: -width * 0.1,
    },
    blob3: {
        width: width * 0.5,
        height: width * 0.5,
        backgroundColor: '#FFD452', // Your app's yellow
        bottom: height * 0.1,
        left: width * 0.3,
    },
    yellowCircle: {
        position: 'absolute',
        borderRadius: 100,
        opacity: 0.08,
    },
    circle1: {
        width: width * 0.3,
        height: width * 0.3,
        backgroundColor: '#FFD452', // Your app's yellow
        top: height * 0.2,
        left: width * 0.1,
    },
    circle2: {
        width: width * 0.2,
        height: width * 0.2,
        backgroundColor: '#FF6CAB', // Your app's pink
        bottom: height * 0.4,
        right: width * 0.2,
    },
    circle3: {
        width: width * 0.4,
        height: width * 0.4,
        backgroundColor: '#6C63FF', // Your app's purple
        bottom: height * 0.6,
        left: width * 0.4,
    },
    circle4: {
        width: width * 0.3,
        height: width * 0.3,
        backgroundColor: '#FFD452', // Your app's yellow
        top: height * 0.7,
        right: width * 0.3,
    },
    circle5: {
        width: width * 0.2,
        height: width * 0.2,
        backgroundColor: '#FF6CAB', // Your app's pink
        bottom: height * 0.8,
        left: width * 0.5,
    },
    lineIcon: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        opacity: 0.1,
    },
    lightbulb: {
        top: height * 0.1,
        left: width * 0.4,
    },
    yellowDots: {
        flexDirection: 'row',
        marginLeft: 8,
    },
    yellowDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFD452', // Your app's yellow
        marginRight: 2,
    },
    globe1: {
        top: height * 0.3,
        left: width * 0.6,
    },
    playButton: {
        top: height * 0.5,
        left: width * 0.2,
    },
    eyeglasses: {
        top: height * 0.7,
        left: width * 0.3,
    },
    smiley: {
        top: height * 0.9,
        left: width * 0.4,
    },
    star: {
        top: height * 0.1,
        right: width * 0.4,
    },
    question1: {
        top: height * 0.3,
        right: width * 0.6,
    },
    question2: {
        bottom: height * 0.1,
        left: width * 0.6,
    },
    exclamation: {
        bottom: height * 0.3,
        right: width * 0.6,
    },
    music: {
        bottom: height * 0.5,
        left: width * 0.6,
    },
    plus: {
        bottom: height * 0.7,
        right: width * 0.6,
    },
    smallDot: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e0e0e0',
    },
    dot1: {
        top: height * 0.2,
        left: width * 0.1,
    },
    dot2: {
        top: height * 0.4,
        right: width * 0.1,
    },
    dot3: {
        bottom: height * 0.2,
        left: width * 0.2,
    },
    dot4: {
        bottom: height * 0.4,
        right: width * 0.2,
    },
    dot5: {
        top: height * 0.6,
        left: width * 0.3,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 100,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    titleText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        textShadowColor: '#667eea',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
        // Stitched effect with dashed border
        borderWidth: 3,
        borderColor: '#667eea',
        borderStyle: 'dashed',
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginVertical: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        overflow: 'hidden',
    },
    subtitleText: {
        fontSize: 18,
        color: '#667eea',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 30,
        fontWeight: '600',
        textShadowColor: 'rgba(102, 126, 234, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingBottom: 50,
        gap: 20,
    },
    button: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    separator: {
        width: 20,
    },
});

export default Welcome; 