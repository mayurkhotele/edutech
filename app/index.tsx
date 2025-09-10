import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const Welcome = () => {
    const router = useRouter();
    const glow = useRef(new Animated.Value(0)).current;
    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;
    const float3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glow, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(glow, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
            ])
        ).start();
        const mkFloat = (val: Animated.Value, duration: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(val, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(val, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
                ])
            ).start();
        mkFloat(float1, 2600);
        mkFloat(float2, 3000);
        mkFloat(float3, 2200);
    }, [glow]);

    const handleLogin = () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}; router.push('/login'); };
    const handleRegister = () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}; router.push('/register'); };
    

  return (
    <LinearGradient colors={[ '#4c1d95', '#7c3aed' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
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

            {/* Study-themed animated icons */}
            <Animated.View style={[styles.studyIcon, {
                top: height * 0.22,
                left: width * 0.12,
                transform: [
                    { translateY: float1.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
                    { rotate: float1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '6deg'] }) }
                ]
            }]}>
                <Ionicons name="book-outline" size={26} color="#ffffff" />
            </Animated.View>
            <Animated.View style={[styles.studyIcon, {
                top: height * 0.55,
                right: width * 0.18,
                transform: [
                    { translateY: float2.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
                    { rotate: float2.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-8deg'] }) }
                ]
            }]}>
                <Ionicons name="pencil-outline" size={24} color="#ffffff" />
            </Animated.View>
            <Animated.View style={[styles.studyIcon, {
                bottom: height * 0.18,
                left: width * 0.2,
                transform: [
                    { translateY: float3.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) },
                    { rotate: float3.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '5deg'] }) }
                ]
            }]}>
                <Ionicons name="school-outline" size={24} color="#ffffff" />
            </Animated.View>
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
            {/* Logo + Title */}
            <Animated.View style={[styles.logoWrap, {
                transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }],
                opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] })
            }]}>
                <View style={styles.logoBadge}>
                    <Ionicons name="school" size={26} color="#fff" />
                </View>
                <View style={styles.titleContainer}>
                    <Text style={styles.brandLine}>YOTTA</Text>
                    <Text style={styles.brandLine}>SCORE</Text>
                </View>
            </Animated.View>
            {/* Tagline */}
            <View style={styles.taglineChip}>
                <Ionicons name="sparkles" size={14} color="#a78bfa" />
                <Text style={styles.taglineText}>Smart Learning Platform</Text>
            </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleLogin} activeOpacity={0.9} style={styles.primaryBtn}>
                <LinearGradient colors={[ '#f59e0b', '#f97316' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtnBg}>
                    <Text style={styles.primaryBtnText}>Login</Text>
                </LinearGradient>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity onPress={handleRegister} activeOpacity={0.9} style={styles.primaryBtn}>
                <LinearGradient colors={[ '#fb923c', '#f59e0b' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtnBg}>
                    <Text style={styles.primaryBtnText}>Register</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#4c1d95',
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
    studyIcon: {
        position: 'absolute',
        opacity: 0.25,
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
        paddingTop: 80,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    brandLine: {
        fontSize: 46,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: 2,
    },
    logoWrap: {
        alignItems: 'center',
    },
    logoBadge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)'
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
    taglineChip: {
        marginTop: 8,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    taglineText: {
        color: '#e9d5ff',
        fontWeight: '700'
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingBottom: 100,
        gap: 20,
    },
    primaryBtn: { flex: 1, borderRadius: 26, overflow: 'hidden' },
    primaryBtnBg: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 26,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
    },
    primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    ghostBtn: {
        flex: 1,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.7)',
        borderRadius: 26,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    ghostBtnText: { color: 'white', fontSize: 18, fontWeight: '800' },
    separator: {
        width: 20,
    },
    guestLinkWrap: { alignItems: 'center', paddingBottom: 20 },
    guestLink: { color: '#e9d5ff', fontWeight: '700' },
});

export default Welcome; 