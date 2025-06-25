import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    title: 'WIN DAILY\n10 CRORES',
    subtitle: 'Ye hai India ka Naya Maidan',
    image: require('../assets/images/icon.png'), // Placeholder image
  },
  {
    key: '2',
    title: 'PLAY DAILY\n20 + GAMES',
    subtitle: 'Compete, Learn, and Win!',
    image: require('../assets/images/icon.png'), // Placeholder image
  },
];

const Welcome = () => {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const ref = useRef(null);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

  return (
    <LinearGradient
        colors={["#6C63FF", "#FF6CAB", "#FFD452"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
    >
        {/* Corner Education Effects */}
     
        <FlatList
            data={slides}
            renderItem={({ item }) => (
                <View style={styles.slide}>
                    <Image source={item.image} style={styles.slideImage} resizeMode="contain" />
                    <Text style={styles.title}>{item.title}</Text>
                    {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
                </View>
            )}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.key}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            ref={ref}
            style={{ flex: 1 }}
        />
        <View style={styles.pagination}>
            {slides.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.dot,
                        currentIndex === index ? styles.dotActive : null,
                    ]}
                />
            ))}
        </View>
        <View style={styles.buttonGlassCard}>
            <TouchableOpacity onPress={() => router.push('/login')} activeOpacity={0.85}>
                <LinearGradient
                    colors={["#FF6CAB", "#7366FF"]}
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
                    colors={["#FFD452", "#FF6CAB"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Register</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    cornerBook: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 90,
        height: 90,
        opacity: 0.18,
        zIndex: 0,
    },
    cornerCap: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 110,
        height: 110,
        opacity: 0.15,
        zIndex: 0,
    },
    slide: {
        width: width,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingTop: 100,
    },
    slideImage: {
        width: width * 0.6,
        height: height * 0.28,
        marginBottom: 40,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.10)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 10,
        opacity: 0.92,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#fff',
        marginHorizontal: 6,
        opacity: 0.4,
        borderWidth: 2,
        borderColor: '#FFD452',
    },
    dotActive: {
        opacity: 1,
        backgroundColor: '#FFD452',
        borderColor: '#fff',
    },
    buttonGlassCard: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 22,
        marginHorizontal: 32,
        marginBottom: Platform.OS === 'ios' ? 60 : 40,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 8,
    },
    button: {
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 36,
        alignItems: 'center',
        marginHorizontal: 8,
        shadowColor: '#FFD452',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    separator: {
        width: 1,
        height: 32,
        backgroundColor: '#fff',
        opacity: 0.3,
        marginHorizontal: 8,
    }
});

export default Welcome; 